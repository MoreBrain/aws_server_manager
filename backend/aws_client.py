import os
import boto3
from botocore.exceptions import ClientError

REGIONS = {
    "Frankfurt": "eu-central-1",
    "Spain":     "eu-south-2",
    "Stockholm": "eu-north-1",
}

# Approximate on-demand prices (USD/hr) for EU regions
INSTANCE_PRICING: dict[str, float] = {
    "g4dn.xlarge":   0.526,
    "g4dn.2xlarge":  0.752,
    "g4dn.4xlarge":  1.204,
    "g4dn.8xlarge":  2.408,
    "g4dn.12xlarge": 3.912,
    "g4dn.16xlarge": 4.816,
    "g5.xlarge":     1.006,
    "g5.2xlarge":    1.212,
    "g5.4xlarge":    1.624,
    "g5.8xlarge":    2.448,
    "g5.12xlarge":   5.672,
    "g5.16xlarge":   4.096,
    "g5.24xlarge":   8.144,
    "g5.48xlarge":  16.288,
    "p3.2xlarge":    3.060,
    "p3.8xlarge":   12.240,
    "p3.16xlarge":  24.480,
    "t3.micro":      0.011,
    "t3.small":      0.023,
    "t3.medium":     0.046,
    "t3.large":      0.092,
    "t3.xlarge":     0.184,
    "m5.large":      0.107,
    "m5.xlarge":     0.214,
    "c5.large":      0.096,
    "c5.xlarge":     0.192,
}


def _session() -> boto3.Session:
    profile = os.getenv("AWS_PROFILE", "account_nsc")
    try:
        return boto3.Session(profile_name=profile)
    except Exception:
        return boto3.Session()


def list_instances() -> list[dict]:
    session = _session()
    results = []

    for region_code in REGIONS.values():
        try:
            ec2 = session.client("ec2", region_name=region_code)
            paginator = ec2.get_paginator("describe_instances")
            for page in paginator.paginate(
                Filters=[{
                    "Name": "instance-state-name",
                    "Values": ["running", "stopped", "pending", "stopping", "shutting-down"],
                }]
            ):
                for reservation in page["Reservations"]:
                    for inst in reservation["Instances"]:
                        name = next(
                            (t["Value"] for t in inst.get("Tags", []) if t["Key"] == "Name"),
                            None,
                        )
                        results.append({
                            "instance_id":   inst["InstanceId"],
                            "name":          name,
                            "region":        region_code,
                            "instance_type": inst["InstanceType"],
                            "status":        inst["State"]["Name"],
                            "public_ip":     inst.get("PublicIpAddress"),
                            "cost_per_hour": INSTANCE_PRICING.get(inst["InstanceType"]),
                        })
        except ClientError as e:
            # Log and continue so other regions still show up
            print(f"[aws] Error listing instances in {region_code}: {e}")

    return results


def start_instance(instance_id: str, region: str) -> bool:
    """Returns True on success, False on InsufficientInstanceCapacity."""
    try:
        ec2 = _session().client("ec2", region_name=region)
        ec2.start_instances(InstanceIds=[instance_id])
        return True
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code == "InsufficientInstanceCapacity":
            return False
        if code == "IncorrectInstanceState":
            # Already running — treat as success so stop schedule activates
            return True
        raise


def stop_instance(instance_id: str, region: str) -> None:
    ec2 = _session().client("ec2", region_name=region)
    ec2.stop_instances(InstanceIds=[instance_id])


def allow_ip_on_port(instance_id: str, region: str, ip: str, port: int = 8443) -> None:
    ec2 = _session().client("ec2", region_name=region)

    response = ec2.describe_instances(InstanceIds=[instance_id])
    instance = response["Reservations"][0]["Instances"][0]
    security_groups = instance["SecurityGroups"]

    for sg in security_groups:
        try:
            ec2.authorize_security_group_ingress(
                GroupId=sg["GroupId"],
                IpPermissions=[{
                    "IpProtocol": "tcp",
                    "FromPort": port,
                    "ToPort": port,
                    "IpRanges": [{"CidrIp": f"{ip}/32", "Description": "Home Office"}],
                }],
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "InvalidPermission.Duplicate":
                pass  # Rule already exists, nothing to do
            else:
                raise
