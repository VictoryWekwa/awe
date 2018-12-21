from setuptools import setup


setup(
    name='awe',
    version='0.4',
    description='Dynamically updated web based reports/dashboards in python.',
    long_description='',
    license='MIT License',
    author='Dan Kilman',
    packages=['awe'],
    install_requires=[
        'bottle',
        'autobahn[twisted]',
        'twisted',
        'pydash',
        'typing'
    ],
    include_package_data=True,
    zip_safe=False,
)